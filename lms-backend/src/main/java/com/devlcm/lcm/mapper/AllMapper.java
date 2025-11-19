package com.devlcm.lcm.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.devlcm.lcm.dto.ChapterDTO;
import com.devlcm.lcm.dto.CourseDTO;
import com.devlcm.lcm.dto.QuizzDTO;
import com.devlcm.lcm.dto.TopicDTO;
import com.devlcm.lcm.dto.UserDTO;
import com.devlcm.lcm.entity.Chapter;
import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.entity.Topic;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.entity.QuizzAndQuestions.Quizz;

@Mapper(componentModel = "spring")
public interface AllMapper {
    // User mappings - DTO doesn't include password for security
    @Mapping(target = "password", ignore = true)
    UserDTO toUserDTO(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "firebaseUid", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "enrolledCourseIds", ignore = true)
    User toUserEntity(UserDTO dto);

    // Course mappings - DTO doesn't include chapterIds (managed separately)
    CourseDTO toCourseDTO(Course course);

    @Mapping(target = "chapterIds", ignore = true)
    Course toCourseEntity(CourseDTO courseDTO);

    // Chapter mappings - DTO doesn't include topicIds (managed separately)
    ChapterDTO toChapterDTO(Chapter chapter);

    @Mapping(target = "topicIds", ignore = true)
    Chapter toChapterEntity(ChapterDTO chapterDTO);

    // Topic mappings
    TopicDTO toTopicDTO(Topic topic);

    Topic toTopicEntity(TopicDTO topicDTO);

    // Quiz mappings
    QuizzDTO toQuizzDTO(Quizz quizz);

    Quizz toQuizzEntity(QuizzDTO quizzDTO);
}
